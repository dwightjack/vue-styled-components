
import hashStr from 'glamor/lib/hash'
import flatten from '../utils/flatten'
import styleSheet from './StyleSheet'
import Stylis from 'stylis'


const stylis = new Stylis({
  global: false,
  cascade: true,
  keyframe: false,
  prefix: true,
  compress: false,
  semicolon: true
})

export default (nameGenerator) => {
  const inserted = {}

  class ComponentStyle {
    constructor (rules) {
      this.rules = rules
      if (!styleSheet.injected) styleSheet.inject()
      this.insertedRule = styleSheet.insert('')
    }

    /*
     * Flattens a rule set into valid CSS
     * Hashes it, wraps the whole chunk in a ._hashName {}
     * Parses that with PostCSS then runs PostCSS-Nested on it
     * Returns the hash to be injected on render()
     * */
    generateAndInjectStyles (executionContext) {
      const flatCSS = flatten(this.rules, executionContext).join('')
        .replace(/^\s*\/\/.*$/gm, '') // replace JS comments
      const hash = hashStr(flatCSS)
      if (!inserted[hash]) {
        const selector = nameGenerator(hash)
        inserted[hash] = selector
        const css = stylis(`.${selector}`, flatCSS, false, false)
        this.insertedRule.appendRule(css)
      }
      return inserted[hash]
    }
  }

  return ComponentStyle
}
