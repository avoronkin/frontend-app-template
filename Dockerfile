FROM avoronkin/nodejs:0.10.36

RUN npm install -g nodemon gulp

WORKDIR /src