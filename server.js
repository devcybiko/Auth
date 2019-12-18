const express = require('express');
const db = require('./models');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const yargs = require('yargs');

async function main() {
    console.log('>>> main');

    var argv = handleArgs();

    var PORT = process.env.PORT || 8080;
    var app = express();
    app.use(express.static('public'));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    app.get('/', function (req, res) {
        res.render('index', {});
    });

    await db.sequelize.sync({ force: argv.force });
    if (argv.force) {
        var newUser = await addUser("Greg", "Smith", "thinkable@thinkable.us", "hokxan9");
        console.log(`New User / Password = ${JSON.stringify(newUser)}`);
        var foundUser = await checkUser("thinkable@thinkable.us", "hokxan9");
        console.log(`Found User / Password = ${JSON.stringify(foundUser)}`);
    } else {
        var goodUser = await checkUser("thinkable@thinkable.us", "hokxan9");
        console.log(`Good User / Password = ${JSON.stringify(goodUser)}`);
        var badUser = await checkUser("thinkable@thinkable.us", "arg...");
        console.log(`Bad User / Password = ${JSON.stringify(badUser)}`);
    }
    var server = await app.listen(PORT);
    var port = server._connectionKey.split(":")[4];
    console.log('App listening on PORT ' + port);
    console.log('<<< main');
}

main();

async function addUser(firstName, lastName, email, password) {
    var user;
    try {
        var result = undefined;
        var hash = await bcrypt.hash(password, saltRounds);
        var newUser = { firstName: firstName, lastName: lastName, email: email, password: hash };
        var data = await db.User.create(newUser);
        user = data.dataValues;
    } catch (err) {
        console.error(`ERROR: ${err}`);
    }
    return user;
}

async function getUser(email) {
    var user;
    try {
        var findUser = { where: { email: email } };
        var found = await db.User.findAll(findUser);
        if (found.length !== 0) {
            user = found[0];
        }
    } catch (err) {
        console.error(`ERROR: ${err}`);
    }
    return user;
}

async function checkUser(email, password) {
    var user;
    try {
        var foundUser = await getUser(email);
        if (foundUser) {
            var isMatched = await bcrypt.compare(password, foundUser.password);
            if (isMatched) user = foundUser;
        }
    } catch (err) {
        console.error(`ERROR: ${err}`);
    }
    return user;
}

function handleArgs() {
    const argv = yargs
        .command('lyr', 'Tells whether an year is leap year or not', {
            year: {
                description: 'the year to check for',
                alias: 'y',
                type: 'number',
            }
        })
        .option('time', {
            alias: 't',
            description: 'Show the current time)',
            type: 'boolean',
        })
        .option('force', {
            alias: 'f',
            description: 'Force the database to reset (drop all tables and recreate)',
            type: 'boolean',
        })
        .help()
        .alias('help', 'h')
        .argv;

    console.log(argv);

    if (argv.time) {
        console.log('The current time is: ', new Date().toLocaleTimeString());
    }

    if (argv._.includes('lyr')) {
        const year = argv.year || new Date().getFullYear();
        if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) {
            console.log(`${year} is a Leap Year`);
        } else {
            console.log(`${year} is NOT a Leap Year`);
        }
        process.exit()
    }

    return argv;
}