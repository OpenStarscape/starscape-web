#!/usr/bin/env python3

from urllib.request import urlopen
import pathlib
import json
import re

timestamp = '2060-01-01'
output_path = str(
  pathlib.Path(__file__).resolve().parent.parent.parent / 'public' / 'solar-system.json')
name_replacements = {
  'Sun': 'Sol',
  'Moon': 'Luna',
}
color_table = {
  'Sol': 'fff548',
  'Mercury': 'bfa47d',
  'Venus': 'd98a3c',
  'Earth': '124faa',
  'Luna': '9f9f9f',
  'Mars': 'cc6241',
  'Phobos': '937662',
  'Deimos': '807c6b',
  'Jupiter': 'd8b099',
  'Saturn': 'd4c79e',
  'Uranus': '5dbcdd',
  'Neptune': '3b63ad',
  'Pluto': '8b856d',
  'Charon': '756561',
}

regex_number_group = r'~?([+-]?[\d\.]+(?:e[+-]?\d+)?)'

def fetch(url: str) -> str:
  with urlopen(url) as response:
    return response.read().decode('utf-8')

def fetch_ephem(body: int, timestamp, center: str, ephem_type: str) -> str:
  # See https://ssd-api.jpl.nasa.gov/doc/horizons.html for API docs
  fmt = 'text' # json format wraps the result in JSON, but it's still all a string :(
  csv = 'NO' # CSV only seems to effect some stuff, doesn't really make parsing easier
  obj_data = 'YES' # mass and other data
  make_ephem = 'YES' # position and velocity
  out_units = 'KM-S'
  range_units = 'KM'
  vec_table = ['2']
  url = ("https://ssd.jpl.nasa.gov/api/horizons.api?" +
    f"format={fmt}&" +
    f"CSV_FORMAT='{csv}'&" + f"COMMAND='{body}'&" +
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

def get_body_data(body: int, timestamp: str) -> dict:
  center = '500@10' # 500: center of body, 10: sun's ID
  ephem_type = 'VECTORS' # can also be ELEMENTS for orbital elements
  result = fetch_ephem(body, timestamp, center, ephem_type)
  data: dict = {}
  data['name'] = re_get(r'target body name:\s(.*) \(' + str(body) + r'\)', result)[0]
  if data['name'] in name_replacements:
    data['name'] = name_replacements[data['name']]
  if data['name'] in color_table:
    data['color'] = '#' + color_table[data['name']]
  data['radius'] = re_get_float(r'(?:vol\. mean )?radius,? \(?km\)?', result)
  mass_groups = re_get(r'mass,? x? ?\(?10\^(\d+) \(?(k?)g ?\)?\s*=\s*' + regex_number_group, result)
  mass_power = int(mass_groups[0])
  mass_is_kg = mass_groups[1] == 'k'
  mass_value = float(mass_groups[2])
  data['mass'] = mass_value * (10 ** (mass_power - (3 if mass_is_kg else 6)))
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
  data['position'] = [
    re_get_float(r'X', position_text),
    re_get_float(r'Y', position_text),
    re_get_float(r'Z', position_text),
  ]
  data['velocity'] = [
    re_get_float(r'VX', velocity_text),
    re_get_float(r'VY', velocity_text),
    re_get_float(r'VZ', velocity_text),
  ]
  return data

def get_system_data(timestamp: str) -> dict:
  body_ids = [
    10, # Sol
    199, # Mercury
    299, # Venus
    399, # Earth
    301, # Luna
    499, # Mars
    599, # Jupiter
    699, # Saturn
    799, # Uranus
    899, # Neptune
    999, # Pluto
    901, # Charon
  ]
  data: dict = {'bodies': []}
  for body_id in body_ids:
    data['bodies'].append(get_body_data(body_id, timestamp))
  return data

def main():
  system = get_system_data(timestamp)
  print(json.dumps(system, indent=2))
  with open(output_path, 'w') as f:
    json.dump(system, f, indent=2)
    pass

if __name__ == '__main__':
  main()
