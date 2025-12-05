// i18next-parser.config.js

module.exports = {
  // Key separator used in your translation keys
  contextSeparator: '.',

  // Save the \_old files
  createOldCatalogs: false,

  // Default namespace used in your i18next config
  defaultNamespace: 'translation',

  // Default value to give to empty keys
  // You may also specify a function accepting the locale, namespace, and key as arguments
  defaultValue: '',

  // Indentation of the catalog files
  indentation: 2,

  // Keep keys from the catalog that are no longer in code
  keepRemoved: false,

  // Key separator used in your translation keys
  // If you want to use plain english keys, separators such as `.` and `:` will conflict. You might want to set
  // `keySeparator: false` and `namespaceSeparator: false`. That way, `t('Status: Loading...')` will not think
  // that there are a namespace and three separator dots for instance.
  // see below for more details
  keySeparator: false,

  lexers: {
    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],
    ts: [
      {
        lexer: 'JavascriptLexer',
        functions: ['translate', 't', '__'],
      },
    ],
    js: [
      {
        lexer: 'JavascriptLexer',
        functions: ['translate', 't', '__'],
      },
    ],
    jsx: [
      {
        lexer: 'JsxLexer',
        functions: ['translate', 't', '__'],
      },
    ],
    tsx: [
      {
        lexer: 'JsxLexer',
        functions: ['translate', 't', '__'],
      },
    ],
    default: ['JsxLexer'],
  },

  // Control the line ending. See options at https://github.com/ryanve/eol
  lineEnding: 'auto',

  // An array of the locales in your applications
  locales: ['en'],

  // Namespace separator used in your translation keys
  // If you want to use plain english keys, separators such as `.` and `:` will conflict. You might want to set
  // `keySeparator: false` and `namespaceSeparator: false`. That way, `t('Status: Loading...')` will not think
  // that there are a namespace and three separator dots for instance.
  namespaceSeparator: false,

  // Supports $LOCALE and $NAMESPACE injection
  // Supports JSON (.json) and YAML (.yml) file formats
  // Where to write the locale files relative to process.cwd()
  output: 'locale_key_compare/langKeys.json',

  // Plural separator used in your translation keys
  // If you want to use plain english keys, separators such as `_` might conflict. You might want to set
  // `pluralSeparator` to a different string that does not occur in your keys.
  pluralSeparator: false,

  // An array of globs that describe where to look for source files
  // relative to the location of the configuration file
  input: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],

  // Whether or not to sort the catalog. Can also be a
  // [compareFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters)
  sort: true,

  // Whether to ignore default values
  // You may also specify a function accepting the locale and namespace as arguments
  skipDefaultValues: false,

  // Whether to use the keys as the default value; ex. "Hello": "Hello", "World": "World"
  // This option takes precedence over the `defaultValue` and `skipDefaultValues` options
  // You may also specify a function accepting the locale and namespace as arguments
  useKeysAsDefaultValue: false,

  // Display info about the parsing including some stats
  verbose: true,

  // Exit with an exit code of 1 on warnings
  failOnWarnings: false,

  // Exit with an exit code of 1 when translations are updated (for CI purpose
  failOnUpdate: false,
}
