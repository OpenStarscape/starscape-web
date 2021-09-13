#!/bin/python3

'''
Generates a JSON array of orbit-related test data. Can be used both to test that a server is
generating correct paramaters and that clients are correctly interpreting them. The 'paramaters'
property contains the same data as the 'orbit' property on Starscape bodies.

Applicable to server tests only: all parameter-defined orbits can be used to calculate a the
location/velocity of a body, but some body states can be represented by multiple orbits.
Specifically circular orbits (semi-major == semi-minor) can have any periapsis value and
orbits on the X/Y plane (inclination == 0) can have any ascending_node value (but the chosen
ascending_node affects periapsis, which may be meaningful. The tests here always use 0 in such
ambiguous cases.
'''

import json
from math import tau, sin, cos, sqrt
import os

# Variables used as dictionary keys (results in slightly prettier code)
name = 'name'
grav_param = 'grav_param'
semi_major = 'semi_major'
semi_minor = 'semi_minor'
inclination = 'inclination'
ascending_node = 'ascending_node'
periapsis = 'periapsis'
start_time = 'start_time'
period_time = 'period_time'
at_time = 'at_time'
completed = 'completed'
position = 'position'
direction = 'direction'
velocity = 'velocity'

# Default values if none specified
default = {
    name: None,
    # Standard gravitational paramater (mass of larger body * gravitational constant)
    grav_param: 1,
    # Length of semi-major axis (long radius)
    semi_major: 1,
    # Length of semi-minor axis (short radius)
    semi_minor: 1,
    # Angle of tilt of the orbit from the XY plane
    inclination: 0,
    # Angle of the ascending_node (place where the body crosses the XY plane)
    ascending_node: 0,
    # Angle of the periapsis (place where the body is closest to the gravity parent)
    # 0 means it's on the ascending node, + goes in the direction of the body
    periapsis: 0,
    # Time at which the body is at the ascending node
    start_time: 0,
    # How much of the orbit has been completed (1 means the body is back at the start)
    completed: 0,
    # The bodies position
    position: [1, 0, 0],
    # The direction the body is going (does not have to be normalized)
    # Veclocity is calculated automatically
    direction: [0, 1, 0],
}

# https://orbitalmechanics.info/ is useful

# Test data
tests = [
    {
        name: 'start of default orbit',
    }, {
        name: 'quarter past default orbit',
        completed: 0.25,
        position: [0, 1, 0],
        direction: [-1, 0, 0],
    }, {
        name: 'half past default orbit',
        completed: 0.5,
        position: [-1, 0, 0],
        direction: [0, -1, 0],
    }, {
        name: 'full rotation default orbit',
        completed: 1,
    }, {
        name: 'half past orbit with grav param',
        completed: 0.5,
        grav_param: 3.5,
        position: [-1, 0, 0],
        direction: [0, -1, 0],
    }, {
        name: 'start of inclined orbit',
        inclination: 0.1 * tau,
        # position is default
        direction: [0, cos(0.1 * tau), sin(0.1 * tau)],
    }, {
        name: 'quarter past inclined orbit',
        inclination: 0.1 * tau,
        completed: 0.25,
        position: [0, cos(0.1 * tau), sin(0.1 * tau)],
        direction: [-1, 0, 0],
    }, {
        name: 'half past inclined orbit',
        inclination: 0.1 * tau,
        completed: 0.5,
        position: [-1, 0, 0],
        direction: [0, -cos(0.1 * tau), -sin(0.1 * tau)],
    }, {
        name: 'start of 90deg ascending node',
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        position: [0, 1, 0],
        direction: [-cos(0.1 * tau), 0, sin(0.1 * tau)],
    }, {
        name: 'quarter past 90deg ascending node',
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        completed: 0.25,
        position: [-cos(0.1 * tau), 0, sin(0.1 * tau)],
        direction: [0, -1, 0],
    }, {
        name: 'half past 90deg ascending node',
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        completed: 0.5,
        position: [0, -1, 0],
        direction: [cos(0.1 * tau), 0, -sin(0.1 * tau)],
    },
    # Distance from center to foci is sqrt(a**2 - b**2), so if the semi-major is the largest member of
    # Pythagorean triple and the semi-minor is either other one, the center-to-focus distance is the
    # final one. The tests generally use 5 and 3, with the center-to-focus = 4.
    {
        name: 'start of flat eliptical',
        semi_major: 5,
        semi_minor: 3,
        position: [1, 0, 0],
        direction: [0, 1, 0],
    }, {
        name: 'start of flat eliptical with start time',
        semi_major: 5,
        semi_minor: 3,
        start_time: 1,
        position: [1, 0, 0],
        direction: [0, 1, 0],
    }, {
        name: 'half past flat eliptical',
        semi_major: 5,
        semi_minor: 3,
        completed: 0.5,
        position: [-9, 0, 0],
        direction: [0, -1, 0],
    }, {
        name: 'start of inclined eliptical',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        position: [1, 0, 0],
        direction: [0, cos(0.1 * tau), sin(0.1 * tau)],
    }, {
        name: 'start of eliptical with 90deg ascending node',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        position: [0, 1, 0],
        direction: [-cos(0.1 * tau), 0, sin(0.1 * tau)],
    }, {
        name: 'start of eliptical with 90deg periapsis',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        periapsis: 0.25 * tau,
        position: [0, cos(0.1 * tau), sin(0.1 * tau)],
        direction: [-1, 0, 0],
    }, {
        name: 'half past eliptical with 90deg periapsis',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        periapsis: 0.25 * tau,
        completed: 0.5,
        position: [0, -9 * cos(0.1 * tau), -9 * sin(0.1 * tau)],
        direction: [1, 0, 0],
    }, {
        name: 'start of eliptical with 90deg periapsis and 90deg ascending node',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        periapsis: 0.25 * tau,
        position: [-cos(0.1 * tau), 0, sin(0.1 * tau)],
        direction: [0, -1, 0],
    }, {
        name: 'half past eliptical with 90deg periapsis and 90deg ascending node',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        periapsis: 0.25 * tau,
        completed: 0.5,
        position: [9 * cos(0.1 * tau), 0, -9 * sin(0.1 * tau)],
        direction: [0, 1, 0],
    }, {
        name: 'half past eliptical with 90deg periapsis and grav param',
        grav_param: 7.2,
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        periapsis: 0.25 * tau,
        completed: 0.5,
        position: [0, -9 * cos(0.1 * tau), -9 * sin(0.1 * tau)],
        direction: [1, 0, 0],
    },
    # Position and direction for the following tests were generated by the js frontend with a high
    # number of iterations
    {
        name: 'quarter past flat eliptical',
        semi_major: 5,
        semi_minor: 3,
        completed: 0.25,
        position: [-6.990524302126245, 2.404253560550809, 0],
        direction: [-0.24241384204161087, -0.10854928913039147, 0],
    }, {
        name: 'quarter past eliptical with 90deg periapsis and 90deg ascending node',
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        ascending_node: 0.25 * tau,
        periapsis: 0.25 * tau,
        completed: 0.25,
        position: [5.655452960011202, -2.40425356055081 ,-4.10892709058194],
        direction: [0.19611691788338723, 0.10854928913039139, -0.1424872813036159],
    }, {
        name: 'quarter past eliptical with 90deg periapsis and grav param',
        grav_param: 7.2,
        semi_major: 5,
        semi_minor: 3,
        inclination: 0.1 * tau,
        periapsis: 0.25 * tau,
        completed: 0.25,
        position: [-2.4042535605508095, -5.655452960011202, -4.10892709058194],
        direction: [0.291268307285801, -0.5262369119099976, -0.382333496308824],
    }
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

# Returns the length of a vector
def magnitude(vec):
    return sqrt(vec[0]**2 + vec[1]**2 + vec[2]**2)

# Returns a new vector with the length set to the given value
def normalize_to(vec, length):
    m = magnitude(vec)
    return [vec[0] * length / m, vec[1] * length / m, vec[2] * length / m]

# Returns the correct velocity vector for the given test based on given direction and calculated speed
def get_velocity(test):
    r = magnitude(test[position])
    # vis-viva equation
    speed = sqrt(test[grav_param] * (2 / r - 1 / test[semi_major]))
    return normalize_to(test[direction], speed)

# Print tests in JSON format
output = []
for test in tests:
    # Kepler's Third Law
    test_period_time = tau * sqrt(test[semi_major]**3 / test[grav_param])
    test_at_time = test[completed] * test_period_time + test[start_time]
    output.append({
        name: test[name],
        'paramaters': [
            test[semi_major],
            test[semi_minor],
            test[inclination],
            test[ascending_node],
            test[periapsis],
            test[start_time],
            test_period_time,
            1, # parent
        ],
        grav_param: test[grav_param],
        at_time: test_at_time,
        position: test[position],
        velocity: get_velocity(test),
    })

if error:
    exit(1)

# Write output files
print('writing ' + str(len(output)) + ' tests to ' + output_path)
with open(output_path, 'w') as f:
    f.write(json.dumps(output, indent=2))

print('done')
