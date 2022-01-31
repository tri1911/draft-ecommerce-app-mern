const AWS = require('aws-sdk');

/**
 * GY: Extract external dependencies to allow potential shimming.
 * - Think of your logic code like your castle to maintain. You want to keep
 *   everything that can potentially change without you knowing outside of it
 * - E.g. if S3 changes their API in a version upgrade, your logic would break
 *   even though you haven't changed your logic code. 
 */
module.exports = {
  S3: AWS.S3,
}
