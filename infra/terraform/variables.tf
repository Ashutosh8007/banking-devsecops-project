variable "aws_region" {
  description = "AWS region for all resources in"
  type        = string
  default     = "us-east-1"
}

variable "key_pair_name" {
  description = "Name of the SSH key pair"
  type        = string
  default     = "banking-devsecops-key"
}

variable "my_ip" {
  description = "Your IP address in CIDR format, for restricting SSH access"
  type        = string
}