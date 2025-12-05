const child_process = require('child_process');
const fs = require('fs')

const outputDir = 'tmp'
const outputFile = `./${outputDir}/tscSilentStats.json`

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
}

child_process.exec(`tsc-silent --project tsconfig.json --suppressConfig tsconfig.ci.js --stats > ${outputFile}`, (err) => {
    const ignoredSrcFilesWithNoErrors = []
    const ignoredSrcFilesWithErrorCodesWith0Errors = []
    const lines = fs.readFileSync(outputFile, 'utf-8')
    const jsonBeginsAtChar = lines.indexOf('\n[\n')
    const json = lines.slice(jsonBeginsAtChar)
    const tscOutput = lines.slice(0, jsonBeginsAtChar)

    if (!!err) {
        console.log(tscOutput)
        // Don't need to parse tsc-silent output because it could change when these type errors are fixed.
        process.exit(err.code)
    }

    const tscSilentOutput = JSON.parse(json)

    for (const fileOutput of tscSilentOutput) {
        if (fileOutput.total === 0) {
            ignoredSrcFilesWithNoErrors.push(fileOutput.pathRegExp)
        }

        for (const code of Object.keys(fileOutput.codes)) {
            const total = fileOutput.codes[code]
            if (total === 0) {
                ignoredSrcFilesWithErrorCodesWith0Errors.push({ path: fileOutput.pathRegExp, code })
            }
        }
    }

    if (ignoredSrcFilesWithNoErrors.length || ignoredSrcFilesWithErrorCodesWith0Errors.length) {
        if (ignoredSrcFilesWithErrorCodesWith0Errors.length) {
            // Don't show a file here if it will be shown below.
            const intersection = ignoredSrcFilesWithErrorCodesWith0Errors.filter(({ path }) => !ignoredSrcFilesWithNoErrors.includes(path))
            if (intersection.length) {
                console.log('Found files with ignored codes with no errors\n')
                ignoredSrcFilesWithErrorCodesWith0Errors.forEach(({ path, code }) => {
                    console.log(`${path} - ${code}`)
                })
            }
        }
        if (ignoredSrcFilesWithNoErrors.length) {
            console.log('\n\nFound ignored files with no type errors\n')
            ignoredSrcFilesWithNoErrors.forEach((path) => {
                console.log(path)
            })
        }
        console.log(
            'Seems like you probably removed some typescript error(s) and you need to update the tsconfig.ci.js file.',
        )
        process.exit(1)
    }
})

