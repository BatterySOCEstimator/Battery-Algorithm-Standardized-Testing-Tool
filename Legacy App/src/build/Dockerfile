FROM python:3.11 AS base

WORKDIR /app

RUN echo "DOCKERFILE IS RUNNING"

COPY requirements.txt /app/

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY webserver/webserver /app/

FROM base AS server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000", "--noreload"]

FROM base AS workers
# not a long term solution
RUN apt update
RUN apt -y install octave

CMD ["python", "manage.py", "runworkers"]