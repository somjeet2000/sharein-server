pipeline {
    agent any
    // agent {
    //     docker {
    //         image 'node:20.15' // Use the node js docker image
    //         args '--user root -v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket for Docker commands
    //     }
    // }

    environment {
        NODE_ENV = 'production'
        // Docker Hub Credentials
        DOCKERHUB_CRED = 'DockerHub-Credentials'
        DOCKERHUB_REPO = 'somjeetsrimani/sharein-server'
        IMAGE_TAG = 'latest'
    }
    
    
    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }
        // Stage - Checkout Works
        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: '*/main']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/somjeet2000/sharein-server.git']])
            }    
        }

        stage('Install Dependencies and Run Tests') {
            // agent {
            //     docker {
            //         image 'node:20' // Use an appropriate Node.js image
            //         args '-v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket
            //     }
            // }
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }

        // Stage - Build docker image works
        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -t $DOCKERHUB_REPO:$IMAGE_TAG .'
                }
            }
        }

        // Stage - Push to Docker Hub works
        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CRED, passwordVariable: 'DOCKERHUB_PASSWORD', usernameVariable: 'DOCKERHUB_USERNAME')]) {
                        sh 'docker login -u $DOCKERHUB_USERNAME -p $DOCKERHUB_PASSWORD'
                        sh 'docker push $DOCKERHUB_REPO:$IMAGE_TAG'
                    }
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
