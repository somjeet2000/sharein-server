pipeline {
    agent {
        docker {
            image 'node:20.15' // Use the node js docker image
            args '--user root -v /var/run/docker.sock:/var/run/docker.sock' // Mount Docker socket for Docker commands
        }
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: '*/main']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/somjeet2000/sharein-server.git']])
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