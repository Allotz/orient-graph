FROM node:8

ADD / .
RUN apt-get update && apt-get install -y python make g++
#     - apk add nodejs
#     - apk add npm
#     - npm i npm@latest -g
#     - apk add python
#     - apk add make g++
#     - npm install --only=production
#     - npm audit fix
#     - npm run build
RUN npm install --only=production
RUN npm audit fix
RUN npm run build
RUN npm install -g serve
ENTRYPOINT ["serve","-s","build"]
