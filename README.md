# pnews
Programming news aggregator service.

Simple website that aggregates news about programming/software development from various sources and aggregates it
nicely.

**At this point pnews is still very limited in functionality, just getting started!**

# Why? #

Because I can :-)
Also, because I want to play around with some new technologies:
- NodeJS (ExpressJS, [Jade](http://jade-lang.com/)
- ReactJS
- MongoDB
- Reddit/HackerNews APIs

# Getting started #

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
forever -w app.js
```

# TODO #
- Use browserify or webpack for ReactJS inclusion

