#!/bin/sh

case "$(hostname)" in
    *proxy*)
        exec rethinkdb proxy --bind all --join rethinkdb-proxy.starlord.tekhou5.dev:29015
        ;;
    *)
        exec rethinkdb --bind all --join rethinkdb-proxy.starlord.tekhou5.dev:29015
        ;;
esac

