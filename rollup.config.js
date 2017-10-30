import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import inject from 'rollup-plugin-inject'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import uglify from 'rollup-plugin-uglify'
import builtins from 'rollup-plugin-node-builtins'
import visualizer from 'rollup-plugin-visualizer'
const pkg = require('./package.json')

const processShim = '\0process-shim'

const prod = process.env.PRODUCTION
const esbundle = process.env.ESBUNDLE

let output
if (prod) {
  console.log('Creating production UMD bundle...')
  output = [{ name: 'styled', file: 'dist/vue-styled-components.min.js', format: 'umd', exports: 'named' }]
} else if (esbundle) {
  console.log('Creating ES modules bundle...')
  output = [{ name: 'styled', file: 'dist/vue-styled-components.es.js', format: 'es', exports: 'named' }]
} else {
  console.log('Creating development UMD bundle')
  output = [{ name: 'styled', file: 'dist/vue-styled-components.js', format: 'umd', exports: 'named' }]
}

const plugins = [
  // Unlike Webpack and Browserify, Rollup doesn't automatically shim Node
  // builtins like `process`. This ad-hoc plugin creates a 'virtual module'
  // which includes a shim containing just the parts the bundle needs.
  {
    resolveId (importee) {
      if (importee === processShim) return importee
      return null
    },
    load (id) {
      if (id === processShim) return 'export default { argv: [], env: {} }'
      return null
    }
  },
  builtins(),
  nodeResolve({
    jsnext: true,
    main: true,
    browser: true,
    preferBuiltins: false
  }),
  commonjs(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
  }),
  inject({
    process: processShim
  }),
  babel({
    babelrc: false,
    presets: [
      ['es2015', { modules: false, loose: true }]
    ],
    plugins: [
      'external-helpers',
      'transform-object-rest-spread',
      'transform-class-properties'
    ]
  }),
  json()
]

if (prod) plugins.push(uglify(), visualizer({ filename: './bundle-stats.html' }))

export default {
  input: 'src/index.js',
  external: (esbundle ? Object.keys(pkg.dependencies) : []),
  output,
  plugins
}
