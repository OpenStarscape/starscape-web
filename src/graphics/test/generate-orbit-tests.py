#!/bin/python3

'''
Generates a JSON array of orbit-related test data. Can be used both to test that a server is
generating correct paramaters and that clients are correctly interpreting them. The 'paramaters'
property contains the same data as the 'orbit' property on Starscape bodies.

Applicable to server tests only: all parameter-defined orbits can be used to
calculate a the location/velocity of a body, but some body states can be represented by multiple
orbits. Specifically circular orbits (semi-major == semi-minor) can have any periapsis value and
orbits on the X/Y plane (inclination == 0) can have any ascending_node value (but the chosen
ascending_node effects periapsis, which may be meaningful. The tests here always use 0 in such
ambiguous cases.
'''

import json
import math
import os

# Variables used as dictionary keys (slightly prettier code)
name = 'name'
semi_major = 'semi_major'
semi_minor = 'semi_minor'
inclination = 'inclination'
ascending_node = 'ascending_node'
periapsis = 'periapsis'
start_time = 'start_time'
period_time = 'period_time'
at_time = 'at_time'
position = 'position'
unambiguous = 'unambiguous'

# Default values if none specified
default = {
    name: None,
    semi_major: 1,
    semi_minor: 1,
    inclination: 0,
    ascending_node: 0,
    periapsis: 0,
    start_time: 0,
    period_time: 1,
    at_time: 0,
    position: [1, 0, 0],
}

# TODO: test non-90 degree angles
# TODO: test that body is at the correct place at correct times on elliptical orbits
# TODO: test that base time and period time have desired effect
# TODO: test velocity

# Test data
tests = [
    {
        name: 'default orbit',
    }, {
        name: 'quarter past default orbit',
        at_time: 0.25,
        position: [0, 1, 0],
    }, {
        name: 'half past default orbit',
        at_time: 0.5,
        position: [-1, 0, 0],
    }, {
        name: 'full rotation default orbit',
        at_time: 1,
    }, {
        name: 'inclanation does not effect position at start',
        inclination: 0.1 * math.tau,
    }, {
        name: 'inclanation deos not effect position at half past',
        inclination: 0.1 * math.tau,
        at_time: 0.5,
        position: [-1, 0, 0],
    }, {
        name: '90deg inclanation and 90deg ascending node',
        inclination: 0.25 * math.tau,
        ascending_node: 0.25 * math.tau,
        position: [0, 1, 0],
    }, {
        name: '90deg inclanation and 90deg periapsis',
        inclination: 0.25 * math.tau,
        periapsis: 0.25 * math.tau,
        position: [0, 0, 1],
    }, {
        name: 'ascending node has no effect when inclination and periapsis are 90deg',
        inclination: 0.25 * math.tau,
        ascending_node: 0.1 * math.tau,
        periapsis: 0.25 * math.tau,
        position: [0, 0, 1],
    }, {
        name: 'quarter past 90deg inclanation',
        inclination: 0.25 * math.tau,
        at_time: 0.25,
        position: [0, 0, 1],
    }, {
        name: 'quarter past 36deg inclanation',
        inclination: 0.1 * math.tau,
        at_time: 0.25,
        position: [0, math.cos(0.1 * math.tau), math.sin(0.1 * math.tau)],
    }, {
        name: 'ascending node has no effect in quarter past 90deg inclanation',
        inclination: 0.25 * math.tau,
        ascending_node: 0.1 * math.tau,
        at_time: 0.25,
        position: [0, 0, 1],
    },
# Distance from center to foci is sqrt(a**2 - b**2), so if the semi-major is the largest member of
# Pythagorean triple and the semi-minor is either other one, the center-to-focus distance is the
# final one. The tests generally use 5 and 3, with the center-to-focus = 4.
    {
        name: 'default elliptical',
        semi_major: 5,
        semi_minor: 3,
    }, {
        name: '',
        semi_major: 2,
        at_time: 0.5,
        position: [-2 - focus_offset, 0, 0],
    }, {
        semi_major: 2,
        periapsis: 0.25 * math.tau,
        position: [0, 2 - focus_offset, 0],
    }, {
        semi_major: 2,
        ascending_node: 0.25 * math.tau,
        periapsis: 0.25 * math.tau,
        position: [-2 + focus_offset, 0, 0],
    }, {
        semi_major: 2,
        inclination: 0.1 * math.tau,
        ascending_node: 0.25 * math.tau,
        periapsis: 0.5 * math.tau,
        position: [0, -2 + focus_offset, 0],
    }, {
        semi_major: 2,
        inclination: 0.1 * math.tau,
        ascending_node: 0.25 * math.tau,
        periapsis: 0.5 * math.tau,
        position: [0, -2 + focus_offset, 0],
    }, {
        semi_major: 2,
        inclination: 0.25 * math.tau,
        ascending_node: 0.25 * math.tau,
        periapsis: 0.25 * math.tau,
        position: [0, 0, 2 - focus_offset],
    }, {
        semi_major: 2,
        inclination: 0.25 * math.tau,
        ascending_node: 0.25 * math.tau,
        periapsis: 0.25 * math.tau,
        at_time: 0.5,
        position: [0, 0, -2 - focus_offset],
    },
]

# Find output path
output_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'orbit-test-data.json')

# Delete output file if it already exists
if os.path.exists(output_path):
    print(output_path + ' exists, deleting…')
    os.remove(output_path)

# Fill in default values
for test in tests:
    for key, default_value in default.items():
        if key not in test:
            test[key] = default_value

error = False
def show_error(msg):
  global error
  error = True
  print('error: ' + msg)

# Check to make sure there aren't any incorrect keys
for i, test in enumerate(tests):
    for key in test.keys():
        if key not in default:
            show_error(
                str(test.get(name, '[no name]')) +
                ' (test ' + str(i) + ') ' +
                'has invalid key "' + str(key) + '": ' +
                repr(test)
            )

# Verify all tests have a unique name
names = {}
for i, test in enumerate(tests):
    if not test.get(name):
        show_error('test ' + str(i) + ' has no name')
    else:
        test_name = test[name]
        normalized = test_name.strip().lower().replace(' ', '')
        if normalized in names:
            show_error(
              test_name + ' (test ' + str(i) + ') ' +
              'has same name as test ' + str(names[normalized])
            )
        else:
            names[normalized] = i

if error:
    exit(1)

# Print tests in JSON format
output = []
for test in tests:
    output.append({
        name: test[name],
        'paramaters': [
            test[semi_major],
            test[semi_minor],
            test[inclination],
            test[ascending_node],
            test[periapsis],
            test[start_time],
            test[period_time],
            1, # parent
        ],
        at_time: test[at_time],
        position: test[position],
    })

# Write output files
print('writing ' + str(len(output)) + ' tests to ' + output_path)
with open(output_path, 'w') as f:
    f.write(json.dumps(output, indent=2))

print('done')
