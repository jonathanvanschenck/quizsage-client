#!/bin/sh

dir="$( realpath "$0" | sed 's|\(.*\)/.*|\1|' )"

useage() {
    echo ""
    echo "Quizsage Fast Shell : start a REPL quickly"
    echo ""
    echo "  Usage: qsshell [OPTIONS]"
    echo ""
    echo "OPTIONS"
    echo "  -h,--help      : Display this help menu."
}


# Many thanks to : https://gist.github.com/mihow/9c7f559807069a03e302605691f85572
if [ ! -e "$dir/.env" ]; then
  echo ".env file not found, please create it" >&2
  exit 1;
fi

# Load the environment
export $(cat "$dir/.env" | sed 's/#.*//g' | xargs)

while [ "$#" -gt 0 ]; do
  case "$1" in

    -h|--help)
      useage
      exit 0
      ;;

    *)
      echo "Unrecognized argument '$1'" >&2
      useage
      exit 1
      ;;
  esac
  shift
done


$dir/repl.sh \
  $([ -z "$EMAIL" ] || ( echo "--username" && echo "$EMAIL" )) \
  $([ -z "$PASSWORD" ] || ( echo "--password" && echo "$PASSWORD" )) \
  $([ -z "$ADDRESS" ] || ( echo "--address" && echo "$ADDRESS" )) \
  $([ -z "$PORT" ] || ( echo "--port" && echo "$PORT" )) \
  $([ -z "$PROTOCOL" ] || ( echo "--protocol" && echo "$PROTOCOL" )) \
  $([ -z "$SELF_SIGNED" ] || ( echo "--self-signed" )) \
