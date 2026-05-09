#!/usr/bin/env python
"""
Build script: reads data/<trip-id>/meta.json files, parses referenced GPX files,
decimates to ~70 points per stage, and writes data.js.

Usage: python scripts/build_data.py
Run from repo root.
"""

import json
import os
import xml.etree.ElementTree as ET

# Paths relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, 'data')
OUTPUT_PATH = os.path.join(REPO_ROOT, 'data.js')

GPX_NS = {'gpx': 'http://www.topografix.com/GPX/1/1'}
TARGET_POINTS = 70

# Canonical trip order -- must match original data.js order
TRIP_ORDER = ['bia', 'rab', 'oro', 'sar', 'slo', 'swi', 'rue']


def parse_gpx_stage(gpx_path):
    """Parse one GPX file. Returns list of [lat, lon, ele_int] decimated to ~70 pts."""
    tree = ET.parse(gpx_path, parser=ET.XMLParser(encoding='utf-8'))
    root = tree.getroot()
    trkpts = root.findall('.//gpx:trkpt', GPX_NS)
    if not trkpts:
        raise ValueError(f'No trkpt elements in {gpx_path}')
    points = []
    for pt in trkpts:
        lat = round(float(pt.get('lat')), 5)
        lon = round(float(pt.get('lon')), 5)
        ele_el = pt.find('gpx:ele', GPX_NS)
        ele = round(float(ele_el.text)) if ele_el is not None else 0
        points.append([lat, lon, ele])
    # Uniform skip decimation
    step = max(1, len(points) // TARGET_POINTS)
    result = points[::step]
    if result[-1] != points[-1]:
        result.append(points[-1])
    return result


def format_stage(points):
    """Format one stage as a compact JS array string."""
    inner = ', '.join(f'[{p[0]},{p[1]},{p[2]}]' for p in points)
    return f'        [{inner}]'


def format_trip(meta, stages):
    """Format one trip object as a JS object literal string."""
    # Escape single quotes in string values
    def esc(s):
        return str(s).replace("'", "\\'")

    hub = meta['hub']
    hub_str = f'[{hub[0]}, {hub[1]}]'

    # Use double-quoted blurb if it contains single quotes
    if "'" in meta['blurb']:
        blurb_line = f'      blurb: "{meta["blurb"]}",'
    else:
        blurb_line = f"      blurb: '{meta['blurb']}',"

    stages_str = ',\n'.join(format_stage(s) for s in stages)

    lines = [
        '    {',
        f"      id: '{meta['id']}',",
        f"      name: '{esc(meta['name'])}',",
        f"      year: {meta['year']},",
        f"      country: '{esc(meta['country'])}',",
        f"      hub: {hub_str},",
        blurb_line,
        f"      months: '{esc(meta['months'])}',",
        f"      color: '{meta['color']}',",
        f"      stages: [",
        stages_str,
        '      ]',
        '    }',
    ]
    return '\n'.join(lines)


IIFE_RUNTIME = '''  var R = 6371;
  function haversine(a, b) {
    var phi1=a[0]*Math.PI/180, phi2=b[0]*Math.PI/180;
    var dphi=(b[0]-a[0])*Math.PI/180, dlam=(b[1]-a[1])*Math.PI/180;
    var x=Math.sin(dphi/2)*Math.sin(dphi/2)+Math.cos(phi1)*Math.cos(phi2)*Math.sin(dlam/2)*Math.sin(dlam/2);
    return 2*R*Math.asin(Math.sqrt(x));
  }

  TRIPS.forEach(function(trip) {
    var dist=0, gain=0, hi=-Infinity, lo=Infinity, all=[];
    trip.stages.forEach(function(stage) {
      for (var i=0; i<stage.length; i++) {
        var p=stage[i];
        if (p[2]>hi) hi=p[2];
        if (p[2]<lo) lo=p[2];
        all.push(p);
        if (i>0) {
          dist += haversine(stage[i-1], stage[i]);
          var d = stage[i][2]-stage[i-1][2];
          if (d>0) gain+=d;
        }
      }
    });
    trip.stats = {
      distance: Math.round(dist),
      elevationGain: Math.round(gain),
      highest: Math.round(hi),
      lowest: Math.round(lo),
      stages: trip.stages.length,
      days: trip.stages.length
    };
    trip.allPoints = all;
  });

  window.TRIPS = TRIPS;
  window.totalDistance = TRIPS.reduce(function(s,t){return s+t.stats.distance;}, 0);
  window.totalElevation = TRIPS.reduce(function(s,t){return s+t.stats.elevationGain;}, 0);'''


def write_data_js(trips):
    """Write data.js with IIFE structure."""
    trip_strings = []
    for meta, stages in trips:
        trip_strings.append(format_trip(meta, stages))

    trips_block = ',\n'.join(trip_strings)

    content = f'(function () {{\n\n  var TRIPS = [\n{trips_block}\n  ];\n\n{IIFE_RUNTIME}\n}})();\n'

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Wrote {OUTPUT_PATH}')


def build():
    """Main build function."""
    # Load meta.json for each trip in canonical order
    trips = []
    for trip_id in TRIP_ORDER:
        meta_path = os.path.join(DATA_DIR, trip_id, 'meta.json')
        if not os.path.isfile(meta_path):
            print(f'WARNING: {meta_path} not found -- skipping {trip_id}')
            continue
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
        if 'gpx_stages' not in meta:
            print(f'WARNING: {meta_path} has no gpx_stages -- skipping {trip_id}')
            continue
        # Parse each GPX stage
        meta_dir = os.path.dirname(meta_path)
        stages = []
        for gpx_rel in meta['gpx_stages']:
            gpx_path = os.path.normpath(os.path.join(meta_dir, gpx_rel))
            print(f'  Parsing {os.path.basename(gpx_path)} ...')
            stage = parse_gpx_stage(gpx_path)
            stages.append(stage)
            print(f'    -> {len(stage)} points')
        print(f'{trip_id}: {len(stages)} stages')
        trips.append((meta, stages))

    if len(trips) != 7:
        print(f'WARNING: expected 7 trips, got {len(trips)}')

    write_data_js(trips)
    print(f'Done. {len(trips)} trips written.')


if __name__ == '__main__':
    build()
