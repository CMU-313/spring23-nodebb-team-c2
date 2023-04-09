from apiflask import APIFlask
from apiflask import Schema
from apiflask.fields import Integer, String
from apiflask.validators import OneOf
from predict import predict
import argparse


app = APIFlask(__name__)

# testing endpoint
@app.get('/') 
def hello_world():
    return {'message': 'Hello world!'}

AGE_RANGE = [str(age) for age in range(18, 26)] # valid age range is [18, 25]

class StudentInput(Schema):
    student_id = String(required=True)
    major = String(required=True) 
    age = String(required=True, validate=OneOf(AGE_RANGE))
    gender = String(required=True)
    gpa = String(required=True)
    extra_curricular = String(required=True)
    num_programming_languages = String(required=True)
    num_past_internships = String(required=True)


@app.post('/prediction')
@app.input(StudentInput)
def make_prediction(student_data):
    try: 
        result_dict: dict = predict(student_data)
        output = result_dict['good_employee']
        return {'good_employee': int(output)}, 200
    except Exception as e: 
        return {
                'error_type': str(type(e)),
                'error_message': str(e)
               }, 400


if __name__ == '__main__': 
    parser = argparse.ArgumentParser(prog="Prediction service", description='API service for predicting whether a student will be successful in career for NodeBB')
    parser.add_argument('-p', '--production', action='store_true')
    args = parser.parse_args()
    is_production = args.production

    if is_production: 
        from waitress import serve 
        serve(app, host="0.0.0.0", port=4000, url_scheme='https')
    else: 
        app.run(host="0.0.0.0", port=4000)