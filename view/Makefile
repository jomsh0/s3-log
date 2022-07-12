default: index.html

clean:
	rm -f index.html

index.html: index.sh.html ../.s3-log.json ../.s3-log.geoip.json
	esh $< >$@
