# pnews
Programming news aggregator service in nodeJS.

Simple website that aggregates news about programming/software development from various sources and aggregates it
nicely.

**At this point pnews is still very limited in functionality, just getting started!**

Currently the only news source is [reddit.com/r/programming](https://reddit.com/r/programming).

The Architecture of pnews is based on a number of microservices (actually, "nanoservice" might be more appropriate):
- pnews-web: webinterface
- pnews-poller: polls news from reddit

The services interact with each other as follows:
```
pnews-web <=  mongo-db  <= pnews-poller <= reddit
```


# Why? #

Because I can :-)
Also, because I want to play around with some new technologies:
- [NodeJS](https://nodejs.org/en/)([ExpressJS](http://expressjs.com/), [Jade](http://jade-lang.com/))
- [ReactJS](https://facebook.github.io/react/)
- [MongoDB](https://www.mongodb.org/)
- Reddit/HackerNews APIs

# Getting started #

## pnews-web ##
To run the web app:
```bash
cd web
npm install
node app.js
```

Web app development:
```bash
cd web
npm install
sudo npm install -g forever
export WEB_SERVER_PORT=3000
export MONGO_DB_URL="mongodb://localhost:27017/pnews_poller"
forever -w app.js
```

## pnews-poller ##
To run the poller app:
```bash
cd poller
npm install
node app.js
```

# Deploying #
You can deploy pnews to a server using Ansible.

The instructions below are for deploying pnews to a Raspberry Pi running Raspbian 8.0. While I expect that the
automation works on any Ubuntu-based linux flavor, this hasn't been tested.

Also, for my own convenience, the default target host is set to a Raspberry running in my own local network.
To change this, modify the IP address and credentials in ```deploy/inventory/raspberrypi```.

NOTE: This deployment code is written for Ansible 1.x and might not work on Ansible 2.x.

```bash
ansible-playbook --ask-pass deploy/site.yml -i deploy/inventory/raspberrypi
```


# TODO #
- Use browserify or webpack for ReactJS inclusion
- Make ansible playbooks more modular so that the different components can be deployed to different servers
- Better approach to logging?
## Nice to have ##
- Serverspec/[testinfra](http://testinfra.readthedocs.org/en/latest/)/
  [envassert](https://pypi.python.org/pypi/envassert)