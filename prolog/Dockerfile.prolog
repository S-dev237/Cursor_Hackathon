FROM swipl:9.2

WORKDIR /app
COPY acadoc.pl .

EXPOSE 8081

CMD ["swipl", "-g", "halt", "-t", "server(8081)", "acadoc.pl"]
