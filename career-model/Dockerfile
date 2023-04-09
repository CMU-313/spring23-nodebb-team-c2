# Use an official Python runtime as a parent image
FROM python:3.9

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install -r requirements.txt

COPY . /code

EXPOSE 4000

ENTRYPOINT [ "python" ]

CMD ["prediction_service.py", "-p"]
