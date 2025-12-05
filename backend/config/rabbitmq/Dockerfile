FROM hashicorp/terraform:1.5.3 as tf

FROM pstauffer/inotify:v1.0.1

COPY --from=tf /bin/terraform /bin/terraform
