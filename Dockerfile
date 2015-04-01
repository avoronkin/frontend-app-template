FROM avoronkin/nodejs:0.10.36

RUN npm install -g nodemon gulp

#install rvm
RUN gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
RUN curl -sSL https://get.rvm.io | bash -s
RUN echo 'source /usr/local/rvm/scripts/rvm' >> /etc/bash.bashrc
RUN bash -l -c 'source /usr/local/rvm/scripts/rvm'
ENV PATH=$PATH:/usr/local/rvm/bin
RUN bash -l -c 'rvm requirements'

#install ruby
RUN bash -l -c 'rvm install 2.2.1'
RUN bash -l -c 'rvm use 2.2.1 --default'

#install compass
RUN  bash -l -c 'gem install compass'
RUN  bash -l -c 'gem install bootstrap-sass'

WORKDIR /src