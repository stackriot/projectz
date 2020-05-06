// Import caterpillar [Caterpillar](https://github.com/bevry/caterpillar) for logging
import { Logger } from 'caterpillar'
import Filter from 'caterpillar-filter'
import Human from 'caterpillar-human'

// Import [Commander](https://github.com/visionmedia/commander.js/) for command and option parsing
import cli from 'commander'

// Import our package data for versioning
import { version } from '../package.json'

// Import out projectz utility
import { Projectz } from './index.js'

// Prepare our logging configuration
const LOG_LEVEL_INFO = 6
const LOG_LEVEL_DEBUG = 7
const EXIT_ERROR_CODE = 1
const level = process.argv.includes('-d') ? LOG_LEVEL_DEBUG : LOG_LEVEL_INFO

// Setup our logging
const logger = new Logger({ level })
const filter = new Filter()
const human = new Human()

// Pipe logger output to filter, then filter output to stdout
logger.pipe(filter).pipe(human).pipe(process.stdout)

// Extract out version out of our package and apply it to commander
cli.version(version)

// Define usage information
cli.usage('<command> [options]')

// Add our cwd customisation
cli.option(
	'-p, --path [value]',
	'Path to the project that you wish to work with, defaults to the current working directory'
)
cli.option('-d', 'Outputs verbose logging.')

// Add the compile command that will create a new projectz instance and compile the project
cli
	.command('compile')
	.description('Compile our project')
	.action(function () {
		// Create our new project and use our caterpillar logger instance for the logging
		logger.log('info', 'Initialising project')
		const project = new Projectz({
			log: logger.log.bind(logger),
			cwd: cli.path || null,
		})
		logger.log('info', 'Initialised project')

		// Load the the files for the new project
		logger.log('info', 'Loading changes')
		project.load(function (err) {
			if (err) {
				logger.log('err', err.stack)
				process.exit(EXIT_ERROR_CODE)
			}
			logger.log('info', 'Loaded changes')

			// And apply the changes
			project.save(function (err) {
				if (err) {
					logger.log('err', err.stack)
					process.exit(EXIT_ERROR_CODE)
				}
				logger.log('info', 'Completed successfully')
			})
		})
	})

cli.on('command:*', function (cmd) {
	cli.outputHelp()
	logger.log('info', ` Unknown command ${cmd}`)
})

// Start the commands
cli.parse(process.argv)

if (!process.argv.slice(2).length) {
	cli.help()
}