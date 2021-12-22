
# Polarity Securonix Integration

Securonix is a platform that delivers a next generation security analytics and operations management platform for the modern era of big data and advanced cyber threats.
The Polarity Securonix integration allows Polarity to search the Securonix API to return User Violation and Incident information on Emails, Domains, and IPs as well as Custom Hostnames and Usernames defined by the user.

To learn more about Securonix please see their official website at [https://www.securonix.com/products/platform-overview/](https://www.securonix.com/products/platform-overview/)

## Securonix Integration Options

### URL

The URL for your Securonix API server which should include the schema (i.e., http, https) and port if required.  For example `https://server-instance.securonix.net`

> Note that the API server value cannot end with a trailing `/`.

### Username

Your Securonix username

### Password

Your Securonix Password

### Search For Employee ID

If enabled, the integration will search Securonix for Employee IDs in the channels specified by the Channel Entity Filter.  This option should be used in conjunction with a Channel Entity Filter on the "Annotated Entities" entity type.  

If you do not see the "Annotated Entities" type under the Manage Integration Data option you will need to uncomment the "string" entityType in the integration's `config.js` file on the server.  After uncommenting this entity type, you will need to
increment the version within the integration's `package.json` file and then restart your Polarity Server. 

### Search Incidents

If enabled, allows you to search Securonix for Incidents related to searched entities.

### Months Back
The number of months you would like to look back for Violations (decimals work as well, e.g. 0.25)

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/