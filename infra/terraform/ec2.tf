# EC2-1 : k3s + Helm (application cluster)

resource "aws_instance" "k3s_app_cluster" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"
  key_name               = aws_key_pair.banking_devsecops_key.key_name
  vpc_security_group_ids = [aws_security_group.banking_devsecops_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "k3s-app-cluster"
    Project = "banking-devsecops-project"
    Role    = "k3s-helm"
  }
}

# EC2-2 : ARGO-CD (GitOps Controller)

resource "aws_instance" "argocd" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.banking_devsecops_key.key_name
  vpc_security_group_ids = [aws_security_group.banking_devsecops_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "argocd-controller"
    Project = "banking-devsecops-project"
    Role    = "argocd"
  }
}

# EC2-3 : Prometheus + Grafana (metrics monitoring)

resource "aws_instance" "monitoring" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.banking_devsecops_key.key_name
  vpc_security_group_ids = [aws_security_group.banking_devsecops_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "prometheus-grafana"
    Project = "banking-devsecops-project"
    Role    = "monitoring"
  }
}

# EC2-4 : ELK Stack (centralized logging)

resource "aws_instance" "elk" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"
  key_name               = aws_key_pair.banking_devsecops_key.key_name
  vpc_security_group_ids = [aws_security_group.banking_devsecops_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name    = "elk-stack"
    Project = "banking-devsecops-project"
    Role    = "elk"
  }
}