# Steven's instructions 

## Setup python virtual environment 

1. I am going to assume that you have Python3 installed

2. Execute the following in terminal: 

```{bash}
python3.10 -m venv career-model/venv                # make python virtual environment
source career-model/venv/bin/activate               # activate virtual environment 
pip install -r career-model/requirements.txt        # install python dependencies
```

3. Now, you can start the service using the following: 

    - if you are testing, then use `% python career-model/prediction_service.py`.
    - if you want to use in production `% python career-model/prediction_service.py --production` or `% python career-model/prediction_service.py -p` for short. 

4. The following endpoints are available: 

    - `127.0.0.1:4000`: a dummy "hello world!" endpoint 
    - `127.0.0.1:4000/prediction`: endpoint handling POST request for making predictions; student info will be contained in request body
    - `127.0.0.1:4000/docs`: UI for API documentation; you can also find schema for POST endpoint request body here 

5. API response format: 

    - If prediction goes smoothly, the status code returned will be 200, and response body JSON will be something like `{'good_employee': <0 or 1>}`; 
    - If there is anything wrong with prediction process (mostly likely that request body is broken), then status code will be 400, and response JSON will contain information on `error_message` and `error_type`. They are both raw python outputs. 


# Career Recruiter ML Model Framework

## Overview
This folder contains an ML model for predicting whether a student applicant would be a good employee, along with some basic starter code for how to interact with the model.

This model should eventually be connected with the career page within NodeBB to allow recruiters to view a prediction of a student applicant's likeliness to be a good employee to hire.

## Setup
1. (Optional) Set up a [virtual environment](https://docs.python.org/3/library/venv.html) for Python
2. Run `pip install -r requirements.txt` to install all dependencies

## Running the Model
The file `predict.py` contains a function `predict` which, given a student application input, returns a prediction whether the student would be a good employee. 

Below is a sample run from the terminal:
```
% python3
>>> from predict import predict
>>> student = {
        "student_id": "student1",
        "major": "Computer Science",
        "age": "20",
        "gender": "M",
        "gpa": "4.0",
        "extra_curricular": "Men's Basketball",
        "num_programming_languages": "1",
        "num_past_internships": "2"
    }
>>> predict(student)
{'good_employee': 1}
```

## Function Inputs
The `predict` function takes in a student info dictionary that contains the following fields (note that all fields are taken as a `string` value and parsed by the model itself):

- `student_id`: unique identifier for the student
- `major`: major of the student
    - Computer Science, Information Systems, Business, Math, Electrical and Computer Engineering, Statistics and Machine Learning
- `age`: age of the student, [18, 25]
- `gender`: gender of the student, M(ale)/F(emale)/O(ther)
- `gpa`: gpa of the student, [0.0, 4.0]
- `extra_curricular`: the most important extracurricular activity to the student
    -  Student Theatre, Buggy, Teaching Assistant, Student Government, Society of Women Engineers, Women in CS, Volleyball, Sorority, Men's Basketball, American Football, Men's Golf, Fraternity
- `num_programming_languages`: number of programming languages that the student is familiar with, [1, 5]
- `num_past_internships`: number of previous internships that the student has had, [0, 4]

## Function Outputs
The `predict` function returns a prediction result dictionary containing the following:

- `good_employee`: int, 1 if the student is predicted to be a good employee, 0 otherwise
