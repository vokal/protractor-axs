"use strict";

var q = require( "q" );
var fs = require( "fs" );
var chalk = require( "chalk" );

/**
 * You can audit your website against the Chrome Accessibility Developer Tools
 * by enabling this plugin in your config file:
 *
 *    // Chrome Accessibility Developer Tools:
 *    exports.config = {
 *      ...
 *      plugins: [{
 *        chromeA11YDevTools: {
 *          treatWarningsAsFailures: true,
 *          axsConfig: {}
 *        },
 *        path: 'node_modules/protractor.plugins/accessiblity'
 *      }]
 *    }
 */

var trimText = function ( text, elementStringLength )
{
    if( text.length > elementStringLength )
    {
        return text.substring( 0, elementStringLength / 2 ) + " ... "
            + text.substring( text.length - elementStringLength / 2 );
    }
    else
    {
        return text;
    }
};

var failCollector = [];
var AUDIT_FILE = require.resolve( "accessibility-developer-tools/dist/js/axs_testing.js" );

/**
 * Audits page source against the Chrome Accessibility Developer Tools, if configured.
 *
 * @param {Object} context The plugin context object
 * @return {q.Promise} A promise which resolves when the audit is finished
 * @private
 */
var runChromeDevTools = function ( context )
{
    var elementStringLength = 200;
    var auditScript = fs.readFileSync( AUDIT_FILE, "utf-8" )
        + " return axs.Audit.run( new axs.AuditConfiguration( " + context.config.chromeA11YDevTools.axsConfig + " ) );";

    var testHeader = "Chrome A11Y - ";

    return browser.executeScript_( auditScript, "a11y developer tool rules" )
        .then( function ( results )
        {
            var auditPromises = [];

            var audit = results.map( function ( result )
            {
                var DOMElements = result.elements;
                if( DOMElements !== undefined )
                {
                    DOMElements.forEach( function ( elem )
                    {
                        auditPromises.push(
                            elem.getOuterHtml().then( function ( text )
                            {
                                return {
                                    code: result.rule.code,
                                    list: trimText( text, elementStringLength )
                                };
                            },
                            function ( reason )
                            {
                                return {
                                    code: result.rule.code,
                                    list: reason
                                };
                            } ) );
                    } );

                    result.elementCount = DOMElements.length;
                }

                return result;
            } );

            var testsDone = function ( elementFailures )
            {
                return audit.forEach( function ( result, index )
                {
                    if( result.result === "FAIL" )
                    {
                        result.warning = result.rule.severity === "Warning"
                            && !context.config.chromeA11YDevTools.treatWarningsAsFailures;

                        if( result.warning )
                        {
                            result.rule.heading =
                                chalk.red( result.rule.heading + " (" + result.elementCount + " failed)" );
                        }

                        result.output = chalk.red( "\n  " + result.elementCount + " failed:" );

                        // match elements returned via promises by their failure codes
                        var repeats = 0;
                        var failureDetails = "";
                        elementFailures.forEach( function ( element, index )
                        {
                            if( element.code === result.rule.code )
                            {
                                var failList = elementFailures[ index ].list;
                                if( failCollector.indexOf( failList ) === -1 )
                                {
                                    failCollector.push( failList );
                                    failureDetails += "\n  " + failList;
                                }
                                else
                                {
                                    repeats++;
                                }
                            }
                        } );

                        if( repeats )
                        {
                            result.output += " " + chalk.yellow( repeats + " repeats" );
                        }

                        if( elementFailures.length > repeats )
                        {
                            result.output += "\n  " + chalk.cyan.underline( result.rule.url );
                            result.output += failureDetails + "\n";
                            var outputType = result.warning ? context.addWarning : context.addFailure;
                            outputType( result.output, { specName: testHeader + result.rule.heading } );
                        }
                        else
                        {
                            result.output += "\n";
                        }

                        console.log( result.output );
                    }
                    else
                    {
                        context.addSuccess( { specName: testHeader + result.rule.heading } );
                    }
                } );
            };

            // Wait for element names to be fetched
            return q.all( auditPromises ).then( testsDone );
        } );
};


/**
 * Checks the information returned by the accessibility audit(s) and
 * displays passed/failed results as console output.
 *
 * @this {Object} The plugin context object
 * @return {q.Promise} A promise which resolves when all audits are finished
 * @public
 */
exports.postTest = function ()
{
    return runChromeDevTools( this );
};
