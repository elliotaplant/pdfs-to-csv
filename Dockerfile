# For linux
# FROM openjdk:8u121-jdk-alpine

# For mac
FROM bellsoft/liberica-openjdk-alpine-musl:17

RUN apk update && apk add maven

COPY pom.xml /
COPY src /src

RUN mvn clean package
# RUN mvn clean package -X

WORKDIR /app

ENTRYPOINT ["java", "-jar", "/target/pdf-jar-with-dependencies.jar"]
