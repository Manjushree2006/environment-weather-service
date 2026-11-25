
def test_assessment_after_sensor_reading(client, token):
    # Generate a user token because only users can register sensors
    user_response = client.post('/api/dev/token', json={
        'role': 'user',
        'subject': 'test-user',
        'field_ids': ['field-demo']
    })

    assert user_response.status_code == 200
    user_token = user_response.json()['access_token']

    headers = {
        'Authorization': f'Bearer {user_token}'
    }

    # Register sensor as an individual user
    registered = client.post(
        '/api/admin/sensors',
        headers=headers,
        json={
            'deviceId': 'assess-sensor',
            'name': 'Assessment sensor',
            'fieldId': 'field-demo'
        }
    )

    assert registered.status_code == 201

    key = registered.json()['sensorKey']

    # Submit sensor reading using the generated sensor key
    submitted = client.post(
        '/api/sensor-data',
        headers={'X-Sensor-Key': key},
        json={
            'deviceId': 'assess-sensor',
            'fieldId': 'field-demo',
            'temperatureC': 27.5,
            'humidityPct': 58
        }
    )

    assert submitted.status_code == 201

    # Retrieve environmental assessment as the same user
    result = client.get(
        '/api/environmental-data?fieldId=field-demo',
        headers=headers
    )

    assert result.status_code == 200
    assert result.json()['conditionLabel'] == 'DATA_AVAILABLE'
    assert result.json()['inputs']['temperature_c'] == 27.5
