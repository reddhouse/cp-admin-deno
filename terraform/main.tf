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
  user_data   = file("user_data.yml")
}

resource "hcloud_ssh_key" "jmt-mac-mini-key" {
  name       = "jmt-mac-mini-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "hcloud_network" "cp-network" {
  name     = "cp-network"
  ip_range = "10.0.0.0/8"
}

resource "hcloud_network_subnet" "cp-subnet" {
  network_id   = hcloud_network.cp-network.id
  type         = "cloud"
  network_zone = "us-west"
  ip_range     = "10.0.1.0/24"
}

resource "hcloud_server_network" "cp-server-network" {
  count      = var.instances
  server_id  = hcloud_server.cp-server[count.index].id
  network_id = hcloud_network.cp-network.id
  ip         = "10.0.1.5"
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
    server.name => server.ipv4_address
  }
}
