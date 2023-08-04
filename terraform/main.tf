## Variables

variable "hcloud_token" {
  # Leaving blank here, and will provide as command line argument.
}


## Providers

terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "1.42.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

## Resources
resource "hcloud_ssh_key" "jmt-mac-mini-key" {
  name       = "jmt-mac-mini-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "hcloud_server" "coopar-server-1" {
  name = "coopar-1"
  # Jammy Jellyfish with standard support until 2027-04-21 
  image       = "ubuntu-20.04"
  server_type = "cpx11"
  location    = "hil"
  ssh_keys    = [hcloud_ssh_key.jmt-mac-mini-key.id]
  # Use templatefile function to insert dynamic value of public ssh key(s) into cloud config file.
  user_data = templatefile("${path.module}/user_data.yml", { jmt-mac-mini-key = file("~/.ssh/id_rsa.pub") })
}

resource "hcloud_network" "coopar-vpc" {
  name     = "coopar-vpc"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "coopar-public-subnet" {
  network_id   = hcloud_network.coopar-vpc.id
  type         = "cloud"
  network_zone = "us-west"
  ip_range     = "10.0.0.0/24"
}

resource "hcloud_server_network" "cp-server-1-network" {
  server_id = hcloud_server.coopar-server-1.id
  subnet_id = hcloud_network_subnet.coopar-public-subnet.id
}


## Outputs

output "coopar-server-1-status" {
  value = hcloud_server.coopar-server-1.status
}

output "coopar-server-1-ip" {
  value = hcloud_server.coopar-server-1.ipv4_address
}
