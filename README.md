# Endpoint Analyzer

Endpoint Analyzer is a command-line tool that provides analysis for different types of endpoints.

## Features
- DNS lookup
- HTTP/S connectivity test incl. Latency measurement
  - Latency also supports a comparison feature using a pre-provided threshold.

## Configuration
1. The tool expects an `analyzer.yml` file in the current working directory (See also `/examples` folder):<br>
```yml
tests:
  - endpoint: 'http://www.google.com'   # Required. The endpoint that should be tested.
    type: http                          # Required. The requested analysis type. Currenrly supporting: dns, http, https
    options:                            # Optional. A set of additional options that should be tested for this specific analysis type.
      latency:                          # Optional. Can be either a boolean or an object containing threshold.
        threshold: 0.01                 # Optional. A threshold that compares current latency with previous latency of test for specific type + endpoint.
                                        # Threshold can be either a number that represents seconds, or a string that represents percentage (ending with %)
  - endpoint: 'www.google.com'
    type: dns
  - endpoint: 'https://www.google.com'
    type: https
```
> Note: The tool also supports passing a command-line parameter with filename

## Output
The Endpoint Analyzer outputs its logs both to stdout/stderr and to a `results.txt` file.<br>
The results text file structure is:
```text
<SUCCESS|FAIL|ALERT>: <details> [<additional tests>]
```
For example:
```
SUCCESS: HTTP test for http://www.google.com [latency: 0.603 seconds]
ALERT: Latency exceeded threshold of 0.01 [previous: 0.589 seconds, current: 0.603 seconds]
SUCCESS: DNS test for www.google.com [lookup: 142.250.185.228]
FAIL: HTTPS test for https://www.google.com 
```


## Quick Start
1. Go to `examples` folder
2. Run: `npm run start`

## Develop
1. Use `npm run start:dev` to use file hot-reloading during development
