pipeline {
    agent any

    environment {
        APP_NAME = 'nexmsg-ui'
        ENV = "${env.BRANCH_NAME == 'main' ? 'prod' : 'dev'}"
        NODE_VERSION = '20'
        HTTPS_PORT = "${env.BRANCH_NAME == 'main' ? '9000' : '9001'}"
        HTTP_PORT = "${env.BRANCH_NAME == 'main' ? '9080' : '9081'}"
    }

    tools {
        nodejs "NodeJS${NODE_VERSION}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci --prefer-offline --no-audit --force
                '''
            }
        }

        stage('Build') {
            steps {
                script {
                    def apiUrl = env.BRANCH_NAME == 'main' 
                        ? 'https://200.178.4.120:6081' 
                        : 'https://200.178.4.120:6081'

                    def envName = env.BRANCH_NAME == 'main' ? 'production' : 'development'

                    sh """
                        REACT_APP_API_URL=${apiUrl} \\
                        REACT_APP_ENV=${envName} \\
                        npm run build
                    """
                }
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def apiUrl = env.BRANCH_NAME == 'main' 
                        ? 'https://200.178.4.120:6081' 
                        : 'https://200.178.4.120:6081'

                    def envName = env.BRANCH_NAME == 'main' ? 'prod' : 'dev'

                    sh """
                        sudo podman build \\
                            --build-arg $VITE_API_URL=${apiUrl} \\
                            --build-arg REACT_APP_ENV=${envName} \\
                            -t ${APP_NAME}:${BUILD_NUMBER} .

                        sudo podman tag ${APP_NAME}:${BUILD_NUMBER} ${APP_NAME}:${ENV}-latest
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    echo "=== Parando container antigo ==="
                    sudo podman stop ${APP_NAME}-${ENV} || true
                    sudo podman rm ${APP_NAME}-${ENV} || true

                    echo "=== Iniciando novo container ==="
                    sudo podman run -d \\
                        --name ${APP_NAME}-${ENV} \\
                        --network bridge \\
                        -p ${HTTPS_PORT}:443 \\
                        -p ${HTTP_PORT}:80 \\
                        --restart=always \\
                        -v /etc/ssl/nexweb-ui:/etc/nginx/ssl:ro \\
                        ${APP_NAME}:${BUILD_NUMBER}

                    echo "=== Gerando serviço systemd ==="
                    sudo podman generate systemd --new --files --name ${APP_NAME}-${ENV}
                    sudo mv container-${APP_NAME}-${ENV}.service /etc/systemd/system/
                    sudo systemctl daemon-reload
                    sudo systemctl enable container-${APP_NAME}-${ENV}

                    echo "=== Container iniciado ==="
                    sudo podman ps | grep ${APP_NAME}

                    echo "=== Logs do container ==="
                    sudo podman logs --tail 20 ${APP_NAME}-${ENV}
                """
            }
        }
    }

    post {
        success {
            echo """
            ✅ Deploy ${ENV} concluído!

            Acessos:
            - HTTP:  http://servidor:${HTTP_PORT}
            - HTTPS: https://servidor:${HTTPS_PORT}
            """
        }
        failure {
            echo "❌ Falha no deploy ${ENV}"
        }
    }
}
