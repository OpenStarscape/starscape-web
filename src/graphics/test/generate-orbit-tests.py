#!/bin/python3

'''
Generates a JSON array of orbit-related test data
Can be used both to test that a server is generating correct paramaters and that clients are correctly interpreting them
The 'paramaters' property contains the same data as the 'orbit' property on Starscape bodies
'''

import json
import math

# Distance from center to foci, if semi major is 2 and semi minor is 1
focus_offset = math.sqrt(2 * 2 - 1 * 1);

# Default values if none specified
default = {
    'semi_major': 1,
    'semi_minor': 1,
    'inclination': 0,
    'ascending_node': 0,
    'periapsis': 0,
    'start_time': 0,
    'period_time': 1,
    'parent_position': [0, 0, 0],
    'at_time': 0,
    'position': [1, 0, 0],
}

# TODO: test parent's position effects position
# TODO: test non-90 degree angles
# TODO: test that body is at the correct place at correct times on elliptical orbits
# TODO: test that base time and period time have desired effect
# TODO: test velocity

tests = [
    {
    }, {
        'at_time': 0.25,
        'position': [0, 1, 0],
    }, {
        'at_time': 0.5,
        'position': [-1, 0, 0],
    }, {
        'at_time': 1,
        'position': [1, 0, 0],
    }, {
        'inclination': 0.1 * math.tau,
        'position': [1, 0, 0],
    }, {
        'inclination': 0.1 * math.tau,
        'at_time': 0.5,
        'position': [-1, 0, 0],
    }, {
        'inclination': 0.25 * math.tau,
        'ascending_node': 0.25 * math.tau,
        'position': [0, 1, 0],
    }, {
        'inclination': 0.25 * math.tau,
        'periapsis': 0.25 * math.tau,
        'position': [0, 0, 1],
    }, {
        'inclination': 0.25 * math.tau,
        'ascending_node': 0.1 * math.tau,
        'periapsis': 0.25 * math.tau,
        'position': [0, 0, 1],
    }, {
        'inclination': 0.25 * math.tau,
        'at_time': 0.25,
        'position': [0, 0, 1],
    }, {
        'inclination': 0.25 * math.tau,
        'ascending_node': 0.1 * math.tau,
        'at_time': 0.25,
        'position': [0, 0, 1],
    }, {
        'ascending_node': 0.3 * math.tau,
        'periapsis': 0.2 * math.tau,
        'position': [-1, 0, 0],
    }, {
        'semi_major': 2,
        'position': [2 - focus_offset, 0, 0],
    }, {
        'semi_major': 2,
        'at_time': 0.5,
        'position': [-2 - focus_offset, 0, 0],
    }, {
        'semi_major': 2,
        'periapsis': 0.25 * math.tau,
        'position': [0, 2 - focus_offset, 0],
    }, {
        'semi_major': 2,
        'ascending_node': 0.25 * math.tau,
        'periapsis': 0.25 * math.tau,
        'position': [-2 + focus_offset, 0, 0],
    }, {
        'semi_major': 2,
        'inclination': 0.1 * math.tau,
        'ascending_node': 0.25 * math.tau,
        'periapsis': 0.5 * math.tau,
        'position': [0, -2 + focus_offset, 0],
    }, {
        'semi_major': 2,
        'inclination': 0.1 * math.tau,
        'ascending_node': 0.25 * math.tau,
        'periapsis': 0.5 * math.tau,
        'position': [0, -2 + focus_offset, 0],
    }, {
        'semi_major': 2,
        'inclination': 0.25 * math.tau,
        'ascending_node': 0.25 * math.tau,
        'periapsis': 0.25 * math.tau,
        'position': [0, 0, 2 - focus_offset],
    }, {
        'semi_major': 2,
        'inclination': 0.25 * math.tau,
        'ascending_node': 0.25 * math.tau,
        'periapsis': 0.25 * math.tau,
        'at_time': 0.5,
        'position': [0, 0, -2 - focus_offset],
    },
]

# Fill in default values
for test in tests:
    for key, default_value in default.items():
        if key not in test:
            test[key] = default_value

# Check to make sure there aren't any incorrect keys
error = False
for i, test in enumerate(tests):
    for key in test.keys():
        if key not in default:
            print('test ' + str(i) + ' has invalid key "' + str(key) + '": ' + repr(test))
            error = True
if error:
    exit(1)

# Print tests in JSON format
output = []
for test in tests:
    output.append({
        'parent_position': test['parent_position'],
        'paramaters': [
            test['semi_major'],
            test['semi_minor'],
            test['inclination'],
            test['ascending_node'],
            test['periapsis'],
            test['start_time'],
            test['period_time'],
            1, # parent
        ],
        'at_time': test['at_time'],
        'position': test['position'],
    })
print(json.dumps(output, indent=2))
