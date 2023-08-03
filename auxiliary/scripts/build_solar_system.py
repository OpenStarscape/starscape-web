#!/usr/bin/env python3

from urllib.request import urlopen
import pathlib
import json
import re

timestamp = '2060-01-01'
output_path = str(
  pathlib.Path(__file__).resolve().parent.parent.parent / 'public' / 'solar-system.json')
api_url = 'https://ssd.jpl.nasa.gov/api/horizons.api?'

class Body:
  def __init__(self, name: str, id: int, radius: float, mass: float, color: str = ''):
    self.props: dict = {}
    self.id = id
    self.props['name'] = name
    self.props['radius'] = radius
    self.props['mass'] = mass
    if color:
      self.props['color'] = '#' + color

# https://en.wikipedia.org/wiki/List_of_Solar_System_objects_by_size
# https://ssd.jpl.nasa.gov/horizons/time_spans.html
bodies = [
  #    name       API ID  radius    mass            color
  Body('Sol',     10,     695700,   1.9885e+27,     'fff548'),
  Body('Mercury', 199,    2440,     3.302e+20,      'bfa47d'),
  Body('Venus',   299,    6051.84,  4.8685e+21,     'd98a3c'),
  Body('Earth',   399,    6371.01,  5.97219e+21,    '124faa'),
  Body('Luna',    301,    1737.53,  7.349e+19,      '9f9f9f'),
  Body('Mars',    499,    3389.92,  6.4171e+20,     'cc6241'),
  Body('Phobos',  401,    11.1,     1.0659e+13,     '937662'),
  Body('Deimos',  402,    6.2,      1.476e+12,      '807c6b'),
  Body('Jupiter', 599,    69911,    1.89818722e+24, '807c6b'),
  Body('Io',      501,    1821.6,   8.932e+19,      'aca144'),
  Body('Europa',  502,    1560.8,   4.8e+19,        'c0a58e'),
  Body('Ganymede',503,    2634.1,   1.482e+20,      '828282'),
  Body('Callisto',504,    2410.3,   1.076e+20,      'ffc99b'),
  Body('Saturn',  699,    58232,    5.6834e+23,     'd4c79e'),
  Body('Titan',   606,    2574.73,  1.345e+20,      'efaf6f'),
  Body('Uranus',  799,    25362,    8.6813e+22,     '5dbcdd'),
  Body('Neptune', 899,    24624,    1.02409e+23,    '3b63ad'),
  Body('Triton',  801,    1353.4,   2.139e+19,      'efdabb'),
  Body('Pluto',   999,    1188.3,   1.307e+19,      '8b856d'),
  Body('Charon',  901,    603.6,    1.53e+18,       '756561'),
  # Only has data for a short time span
  #Body('Eris',    920136199,1163,   1.66e+19,       'd9c6c4'),
]

regex_number_group = r'~?([+-]?[\d\.]+(?:e[+-]?\d+)?)'

def fetch(url: str) -> str:
  with urlopen(url) as response:
    return response.read().decode('utf-8')

def fetch_ephem(body: int, timestamp, center: str, ephem_type: str) -> str:
  # See https://ssd-api.jpl.nasa.gov/doc/horizons.html for API docs
  fmt = 'text' # json format wraps the result in JSON, but it's still all a string :(
  csv = 'NO' # CSV only seems to effect some stuff, doesn't really make parsing easier
  obj_data = 'NO' # mass and other data, poorly formatted
  make_ephem = 'YES' # position and velocity
  out_units = 'KM-S'
  range_units = 'KM'
  vec_table = ['2']
  url = (api_url +
    f"format={fmt}&" +
    f"CSV_FORMAT='{csv}'&" +
    f"COMMAND='{body}'&" +
    f"OBJ_DATA='{obj_data}'&" +
    f"MAKE_EPHEM='{make_ephem}'&" +
    f"EPHEM_TYPE='{ephem_type}'&" +
    f"CENTER='{center}'&" +
    f"OUT_UNITS='{out_units}'&" +
    f"RANGE_UNITS='{range_units}'&" +
    f"VEC_TABLE={','.join(vec_table)}&" +
    f"TLIST='{timestamp}'")
  print('fetching ' + url)
  return fetch(url)

def re_get(pattern: str, text: str) -> tuple[str, ...]:
  pattern = r'(?:^\s*|\n\s*|  |\d )' + pattern
  matches = re.findall(pattern, text, re.IGNORECASE)
  assert len(matches), pattern + ' did not appear within text:\n\n' + text
  if isinstance(matches[0], str):
    matches[0] = (matches[0],)
  assert len(matches) == 1, pattern + ' appeared multiple times within the text:\n\n' + text
  return matches[0]

def re_get_float(pattern: str, text: str) -> float:
  return float(re_get(pattern + r'\s*=\s*' + regex_number_group, text)[0])

def get_body_vectors(body: int, timestamp: str) -> tuple[list[float], list[float]]:
  center = '500@10' # 500: center of body, 10: sun's ID
  ephem_type = 'VECTORS' # can also be ELEMENTS for orbital elements
  result = fetch_ephem(body, timestamp, center, ephem_type)
  position_text = re_get(
    r'(X\s*=\s*' + regex_number_group +
    r'\s*Y\s*=\s*' + regex_number_group +
    r'\s*Z\s*=\s*' + regex_number_group +
    r')', result)[0]
  velocity_text = re_get(
    r'(VX\s*=\s*' + regex_number_group +
    r'\s*VY\s*=\s*' + regex_number_group +
    r'\s*VZ\s*=\s*' + regex_number_group +
    r')', result)[0]
  position = [
    re_get_float(r'X', position_text),
    re_get_float(r'Y', position_text),
    re_get_float(r'Z', position_text),
  ]
  velocity = [
    re_get_float(r'VX', velocity_text),
    re_get_float(r'VY', velocity_text),
    re_get_float(r'VZ', velocity_text),
  ]
  return (position, velocity)

def get_system_data(timestamp: str) -> dict:
  data: dict = {'bodies': []}
  for body in bodies:
    position, velocity = get_body_vectors(body.id, timestamp)
    body.props['position'] = position
    body.props['velocity'] = velocity
    data['bodies'].append(body.props)
  return data

def main():
  system = get_system_data(timestamp)
  print(json.dumps(system, indent=2))
  with open(output_path, 'w') as f:
    json.dump(system, f, indent=2)
    pass

if __name__ == '__main__':
  main()
