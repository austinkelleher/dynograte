/*jshint -W030 */
/* jshint devel:true */
'use strict';

const chai = require('chai');
const Dynograte = require('../lib/Dynograte');
const expect = require('chai').expect;

require('chai').should();
chai.config.includeStack = true;

describe('Dynograte configuration test', function() {
  it('should enable logging by passing logger', () => {
    let original = {
      info(msg) {
        console.log(msg);
      }
    };

    let dynograte = new Dynograte({ logger: original });
    let logger = dynograte.getLogger();

    expect(logger.info).to.be.a('function');
    expect(logger.error).to.be.a('function');
  });
});
