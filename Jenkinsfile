pipeline {
    agent {
        docker {
            image 'node:20.15' // Use the node js docker image
            args '--user root -v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket for Docker commands
        }
    }

    // Stage - Checkout Works

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: '*/main']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/somjeet2000/sharein-server.git']])
            }    
        }

        stage('Static Code Analysis') {
            environment {
                SONAR_URL = "http://localhost:9000/"
                SONARQUBE_TOKEN = credentials('sonarqube')
            }
            steps {
                def scannerHome = tool 'SonarScanner';
                withSonarQubeEnv(credentialsId: 'sonarqube') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}