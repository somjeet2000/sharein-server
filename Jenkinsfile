pipeline {
    agent {
        docker {
            image 'node:20' // Use the node js docker image
            args '--user root -v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket for Docker commands
        }
    }

    environment {
        SONAR_TOKEN = credentials('SonarToken')
        scannerHome = tool name: 'SonarScanner'
    }

    // Stage - Checkout Works

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: '*/main']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/somjeet2000/sharein-server.git']])
            }    
        }

        stage('Static Code Analysis') {
            steps {
                script {
                    echo "========== Static Code Analysis Started =========="
                    sh "echo ${scannerHome}"
                    withSonarQubeEnv('SonarServer') {
                        sh "${scannerHome}/bin/sonar-scanner --version"
                    }

                    echo "=========== Static Code Analysis Ended =========="
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