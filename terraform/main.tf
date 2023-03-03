## Variables

variable "hcloud_token" {
  # Leaving blank here, and will provide as command line argument.
}

variable "location" {
  default = "hil"
}

variable "http_protocol" {
  default = "http"
}

variable "http_port" {
  default = "80"
}

variable "instances" {
  default = "1"
}

variable "server_type" {
  default = "cpx11"
}

variable "os_type" {
  # Jammy Jellyfish with standard support until 2027-04-21 
  default = "ubuntu-20.04"
}

variable "disk_size" {
  default = "40"
}

variable "ip_range" {
  default = "10.0.0.0/24"
}

## Provider

terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "1.36.2"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

## Resources

resource "hcloud_server" "cp-server" {
  count       = var.instances
  name        = "cp-server-${count.index}"
  image       = var.os_type
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.jmt-mac-mini-key.id]
  public_net {
    ipv4_enabled = false
    ipv6_enabled = true
  }
  user_data = file("user_data.yml")
}

resource "hcloud_ssh_key" "jmt-mac-mini-key" {
  name       = "jmt-mac-mini-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "hcloud_network" "cp-public-network" {
  name     = "cp-public-network"
  ip_range = var.ip_range
}


## Outputs

output "app_servers_status" {
  value = {
    for server in hcloud_server.cp-server :
    server.name => server.status
  }
}

output "app_servers_ips" {
  value = {
    for server in hcloud_server.cp-server :
    server.name => server.ipv6_address
  }
}
