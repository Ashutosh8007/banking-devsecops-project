output "k3s_app_cluster_ip" {
  value = aws_instance.k3s_app_cluster.public_ip
}

output "argocd_ip" {
  value = aws_instance.argocd.public_ip
}

output "monitoring_ip" {
  value = aws_instance.monitoring.public_ip
}

output "elk_ip" {
  value = aws_instance.elk.public_ip
}