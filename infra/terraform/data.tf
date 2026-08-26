# Dynamically fetch the latest Ubuntu 22.04 LTS AMI for the configured region
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's official AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# SSH key pair for EC2 access — public key uploaded to AWS, private key stays local
resource "aws_key_pair" "banking_devsecops_key" {
  key_name   = var.key_pair_name
  public_key = file("${path.module}/../ssh-keys/banking-devsecops-key.pub")
}
