#!/usr/bin/env node

import{parsingCommands} from './parsing/parsing'


const args = process.argv.slice(2);

parsingCommands(args)