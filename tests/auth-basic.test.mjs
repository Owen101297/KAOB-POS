import test from 'node:test';
import assert from 'node:assert/strict';
import {isBasicAuthConfigured,isBasicAuthAuthorized,isDevelopmentAuthBypassAllowed} from '../lib/auth-basic.ts';
const user='qa-user',password='fixture-password-long-enough';
const header=(u,p)=>'Basic '+Buffer.from(u+':'+p).toString('base64');
test('production rejects missing, incorrect and malformed credentials',()=>{
 process.env.NODE_ENV='production';delete process.env.KAOB_POS_AUTH_USER;delete process.env.KAOB_POS_AUTH_PASSWORD;
 assert.equal(isDevelopmentAuthBypassAllowed(),false);assert.equal(isBasicAuthConfigured(),false);assert.equal(isBasicAuthAuthorized(header(user,password)),false);
 process.env.KAOB_POS_AUTH_USER=user;process.env.KAOB_POS_AUTH_PASSWORD=password;
 assert.equal(isBasicAuthConfigured(),true);assert.equal(isBasicAuthAuthorized(null),false);assert.equal(isBasicAuthAuthorized('Bearer invalid'),false);assert.equal(isBasicAuthAuthorized('Basic !!!!'),false);
 assert.equal(isBasicAuthAuthorized(header(user,'wrong-password')),false);assert.equal(isBasicAuthAuthorized(header('other',password)),false);assert.equal(isBasicAuthAuthorized(header(user,password)),true);
 process.env.KAOB_POS_AUTH_USER='bad:user';assert.equal(isBasicAuthConfigured(),false);
});
test('development bypass requires both credentials to be absent',()=>{
 process.env.NODE_ENV='development';delete process.env.KAOB_POS_AUTH_USER;delete process.env.KAOB_POS_AUTH_PASSWORD;assert.equal(isDevelopmentAuthBypassAllowed(),true);
 process.env.KAOB_POS_AUTH_USER=user;assert.equal(isDevelopmentAuthBypassAllowed(),false);
});
