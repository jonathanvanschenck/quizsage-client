#!/bin/sh

dir="$( realpath "$0" | sed 's|\(.*\)/.*|\1|' )"

useage() {
    echo ""
    echo "Quizsage Shell : start a REPL"
    echo ""
    echo "  Usage: qsshell [OPTIONS]"
    echo ""
    echo "OPTIONS"
    echo "  -h,--help             : Display this help menu."
    echo "  -u,--username         : Username for Robo-cameron"
    echo "  -p,--password         : Password for Robo-cameron"
    echo "     --address          : Set the address of server. Default is 'localhost'"
    echo "     --port             : Set the port of server. Default is 443"
    echo "     --protocol         : Set the protocol of server. Default is 'https'"
    echo "     --self-signed      : Allow self-signed certs"
}

# Set defaults
_username=''
password=''
address='localhost'
port=443
protocol='https'
self_signed=''

# Unpack all the args
while [ "$#" -gt 0 ]; do
  case "$1" in
    -u|--username|--username=*)
      if [ "$1" != "*=*" ]; then shift; fi
      _username="${1#*=}"
      if [ -z "$_username" ]; then
        echo "Bad username" >&2 
        useage
        exit 1
      fi
      ;;

    -p|--password|--password=*)
      if [ "$1" != "*=*" ]; then shift; fi
      password="${1#*=}"
      if [ -z "$password" ]; then
        echo "Bad password" >&2 
        useage
        exit 1
      fi
      ;;

    --address|--address=*)
      if [ "$1" != "*=*" ]; then shift; fi
      address="${1#*=}"
      if [ -z ""$address"" ]; then
        echo "Bad address '$address'" >&2 
        useage
        exit 1
      fi
      ;;

    --port|--port=*)
      if [ "$1" != "*=*" ]; then shift; fi
      port="${1#*=}"
      if [ ! "$port" -eq "$port" ] 2>/dev/null; then
        echo "Bad port '$port'" >&2 
        useage
        exit 1
      fi
      ;;

    --self-signed)
      self_signed="true"
      ;;

    --protocol|--protocol=*)
      if [ "$1" != "*=*" ]; then shift; fi
      protocol="${1#*=}"
      if [ -z ""$protocol"" ]; then
        echo "Bad protocol '$protocol'" >&2 
        useage
        exit 1
      fi
      ;;

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

if [ -z "$api_key" ]; then
    if [ -z "$_username" ]; then
        printf "Username : "
        read _username
    fi
    if [ -z "$password" ]; then
        # POSIX compliant : https://stackoverflow.com/a/3980713/13217806
        stty -echo
        printf "Password : "
        read password
        stty echo
        printf "\n"
    fi
fi

# $dir/dump.js \
$dir/repl.js \
  "$_username" \
  "$password" \
  "$address" \
  "$port" \
  "$protocol" \
  "$self_signed"
