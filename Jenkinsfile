pipeline {
    agent {
        docker {
            image 'node:20.15' // Use the node js docker image
            args '-v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket for Docker commands
        }
    }
    environment {
        DOCKERHUB_CREDENTIALS = withCredentials('dockerhub-credentails') // Configured in Jenkins
        IMAGE_NAME = 'somjeetsrimani/sharein-server'
        SONARQUBE_SERVER = 'http://localhost:9000'
        SONARQUBE_TOKEN = withCredentials('sonarqube')
    }
    stages {
        stage('Checkout Repository') {
            steps {
                git 'https://github.com/somjeet2000/sharein-server.git'
                sh 'echo Success: Repository Checkout'
            }
        }

        stage('Verify Workspace') {
            steps {
                sh 'pwd'  // Print the current working directory
                sh 'ls -la'  // List files in the current directory
            }
        }

        stage('Static Code Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                    sonar-scanner \
                    -Dsonar.projectKey=sharein-server \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=${SONARQUBE_SERVER} \
                    -Dsonar.login=${SONARQUBE_TOKEN}
                    '''
                }
            }
        }

        stage('Build & Test') {
            steps {
                script {
                    docker.build("${env.IMAGE_NAME}:${env.BUILD_ID}")
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'DOCKERHUB_CREDENTIALS') {
                        docker.image("${env.IMAGE_NAME}:${env.BUILD_ID}").push()
                    }
                }
            }
        }
    
        // stage('Deploy to Render') {
        //     steps {
        //         sh 'scripts/deployment.sh'
        //     }
        // }
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