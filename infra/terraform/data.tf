# Pinned Ubuntu 22.04 LTS AMI - intentionally NOT using most_recent=true.
# Using "latest" causes Terraform to replace all EC2 instances (destroying
# data) whenever Canonical releases a new AMI build, even with no config
# changes on our end. Pinning keeps infrastructure deterministic across time.
# To intentionally upgrade the AMI, update this ID manually and expect
# instance replacement.
data "aws_ami" "ubuntu" {
  most_recent = false
  owners      = ["099720109477"] # Canonical's official AWS account ID

  filter {
    name   = "image-id"
    values = ["ami-05a3e9423ae4d7a19"]
  }
}

# SSH key pair for EC2 access — public key uploaded to AWS, private key stays local
resource "aws_key_pair" "banking_devsecops_key" {
  key_name   = var.key_pair_name
  public_key = file("${path.module}/../ssh-keys/banking-devsecops-key.pub")
}
