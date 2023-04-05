from apiflask import APIFlask
from apiflask import Schema
from apiflask.fields import Integer, String
from predict import predict

app = APIFlask(__name__, docs_ui='swagger-ui', docs_path='/docs')

# testing endpoint
@app.get('/') 
def hello_world():
    return {'message': 'Hello world!'}



# student = {
#         "student_id": "student1",
#         "major": "Computer Science",
#         "age": "20",
#         "gender": "M",
#         "gpa": "4.0",
#         "extra_curricular": "Men's Basketball",
#         "num_programming_languages": "1",
#         "num_past_internships": "2"
#     }

class StudentInput(Schema):
    student_id = String(required=True)
    major = String(required=True) 
    age = String(required=True)
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
    app.run(host="0.0.0.0", port=4000)