const fs = require('fs');
const assert = require('assert');
const path = require('path');
const { hcltojson } = require('./dist/hcltojson');
const { testarray } = require('./dist/hcltojson');
const { parseModule } = require('./dist/hcltojson');

// const tf = fs.readFileSync(path.join(__dirname, 'example.tf'), 'utf-8');
// const expected = {
//   resource: {
//     aws_security_group: {
//       allow_ssh: {
//         description: 'Allow SSH inbound from anywhere',
//         ingress: {
//           cidr_blocks: ['0.0.0.0/0'],
//           from_port: 22,
//           protocol: 'tcp',
//           to_port: 22,
//         },
//         name: 'allow_ssh',
//         vpc_id: 'arn',
//       },
//     },
//   },
// };
//
// assert.deepEqual(
//   hcltojson(tf),
//   expected,
//   'Parsed Terraform does not match expected',
// );
//
// const strings =  ['Apple', 'Orange', 'Banana'];
// assert.deepEqual(testarray(strings),"Apple,Orange,Banana","Failed");

// const module1 = {
//   files: {
//     file1: "Content1",
//     file2: "Content2"
//   }
// };


// const module2 = {
//   files:{
//     'vpc.tf' : "locals {\n  ec2_instance_root_device_encrypted = false\n}\n\n# -------- VPC --------\nresource \"aws_internet_gateway\" \"igw\" {\n  vpc_id = aws_vpc.main.id\n  tags = {\n    Environment = \"local\"\n    Author      = \"kamil.potrec\"\n  }\n}\nresource \"aws_network_acl\" \"public\" {\n  vpc_id     = aws_vpc.main.id\n  subnet_ids = [aws_subnet.public.id]\n  tags = {\n    Environment = \"local\"\n    Author      = \"kamil.potrec\"\n  }\n}\n\nresource \"aws_network_acl_rule\" \"public_inbound\" {\n  network_acl_id = aws_network_acl.public.id\n\n  egress      = false\n  rule_number = 100\n  rule_action = \"allow\"\n  from_port   = 0\n  to_port     = 0\n  protocol    = \"-1\"\n  cidr_block  = var.aws_network_acl_rule_inbound\n}\n\nresource \"aws_network_acl_rule\" \"public_outbound\" {\n  network_acl_id = aws_network_acl.public.id\n\n  egress      = true\n  rule_number = 100\n  rule_action = \"allow\"\n  from_port   = 0\n  to_port     = 0\n  protocol    = \"-1\"\n  cidr_block  = \"0.0.0.0/0\"\n}\nresource \"aws_route_table\" \"public\" {\n  vpc_id = aws_vpc.main.id\n  tags = {\n    Environment = \"local\"\n    Author      = \"kamil.potrec\"\n  }\n}\n\nresource \"aws_route\" \"public_internet_gateway\" {\n  route_table_id         = aws_route_table.public.id\n  destination_cidr_block = \"0.0.0.0/0\"\n  gateway_id             = aws_internet_gateway.igw.id\n}\n\nresource \"aws_route_table_association\" \"public\" {\n  subnet_id      = aws_subnet.public.id\n  route_table_id = aws_route_table.public.id\n}\nresource \"aws_subnet\" \"public\" {\n  vpc_id     = aws_vpc.main.id\n  cidr_block = \"10.0.1.0/24\"\n  tags = {\n    Environment = \"local\"\n    Author      = \"kamil.potrec\"\n  }\n}\nresource \"aws_vpc\" \"main\" {\n  cidr_block = \"10.0.0.0/16\"\n  tags = {\n    Environment = \"local\"\n    Author      = \"kamil.potrec\"\n  }\n}\n\n# -------- VM --------\nlocals {\n  ubuntu_ami_filter = \"ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*\"\n}\n\ndata \"aws_ami\" \"ubuntu\" {\n  most_recent = var.use_most_recent_ami\n\n  filter {\n    name   = \"name\"\n    values = [local.ubuntu_ami_filter]\n  }\n\n  filter {\n    name   = \"virtualization-type\"\n    values = [\"hvm\"]\n  }\n\n  owners = [\"099720109477\"] # Canonical\n}\n\nresource \"aws_key_pair\" \"deployer\" {\n  key_name_prefix = \"deployer\"\n  public_key      = file(var.key_location)\n}\n\nresource \"aws_instance\" \"web\" {\n  ami                    = data.aws_ami.ubuntu.id\n  instance_type          = \"t3.micro\"\n  subnet_id              = aws_subnet.public.id\n  key_name               = aws_key_pair.deployer.key_name\n  vpc_security_group_ids = [aws_security_group.allow.id]\n\n  root_block_device {\n    encrypted = local.ec2_instance_root_device_encrypted\n  }\n\n  tags = {\n    Name = \"HelloWorld\"\n  }\n\n  provisioner \"local-exec\" {\n    command = \"echo Not such a great idea on CI/CD box > /tmp/please-dont-do-it.txt\"\n  }\n}\n\nresource \"aws_eip\" \"web\" {\n  instance                  = aws_instance.web.id\n  associate_with_private_ip = aws_instance.web.private_ip\n}\n\nresource \"aws_security_group\" \"allow\" {\n  name        = \"allow-${uuid()}\"\n  description = \"Default group\"\n  vpc_id      = aws_vpc.main.id\n\n  tags = {\n    Environment = \"local\"\n    Author      = \"kamil.potrec\"\n  }\n}\n\nresource \"aws_security_group_rule\" \"ssh\" {\n  type              = \"ingress\"\n  from_port         = 22\n  to_port           = 22\n  protocol          = \"tcp\"\n  cidr_blocks       = [var.remote_user_addr]\n  security_group_id = aws_security_group.allow.id\n}\n\nresource \"aws_security_group_rule\" \"egress\" {\n  type              = \"egress\"\n  from_port         = 0\n  to_port           = 65535\n  protocol          = \"all\"\n  cidr_blocks       = [\"0.0.0.0/0\"]\n  security_group_id = aws_security_group.allow.id\n}\n\n",
//     'variables.tf' :"variable \"aws_network_acl_rule_inbound\" {\n  type = string\n  default = \"10.0.0.0/24\"\n}\n\nvariable \"use_most_recent_ami\" {\n  type = bool\n  default = true\n}\n\nvariable \"key_name\" {\n  type = string\n  default = \"deployer-dev\"\n}\n\nvariable \"key_location\" {\n  type = string\n  default = \"./id_rsa.pub\"\n}\n\nvariable \"key_location_priv\" {\n  type = string\n  default = \"./id_rsa\"\n}\n\nvariable \"remote_user_addr\" {\n  type = string\n}\n",
//     'terraform.tfvars' :"aws_network_acl_rule_inbound = \"10.0.4.0/24\"\n",
//     'outputs.tf' :"output \"vpc_id\" {\n  value = aws_vpc.main.id\n}\n\noutput \"subnet_id\" {\n  value = aws_subnet.public.id\n}\n\noutput \"instance_private_ip\" {\n  value = aws_instance.web.private_ip\n}\n\noutput \"ssh_command\" {\n  value = \"ssh  ubuntu@${aws_eip.web.public_ip}\"\n}\n"
//   },
//   flags:{
//     '-var':"test1=value1"
//   },
//   env:[
//     "name=value"
//   ]
// };

// -var-file can also get a different file extension - check this later
const VALID_FILE_TYPES = ['tf', 'json', 'tfvars'];

function getFileType(filePath) {
  const filePathSplit = filePath.split('.');
  return filePathSplit[filePathSplit.length - 1].toLowerCase();
}

function hasValidFileType(filePath) {
  return VALID_FILE_TYPES.includes(getFileType(filePath));
}

function getFileContent (filePath) {
  return  fs.readFileSync(filePath, 'utf-8');
}

function prepareModuleParsingConfig (path) {
  let filePaths = [];

  filePaths = fs.readdirSync(path, {withFileTypes: true})
    .filter(item => !item.isDirectory() && hasValidFileType(item.name))
    .map(item => item.name);

  let files = {};
  filePaths.forEach((filePath) => {
    files[filePath] = getFileContent(path + '/' +filePath);
  });

  return {
    files,
    flags:{
      '-var':"test1=value1"
    },
    env:[
      "name=value"
    ]
  };
}

const moduleParsingConfig = prepareModuleParsingConfig('/Users/iliannapapastefanou/snyk-repos/goof-cloud-config-terraform-langfeatures-demo/variables');

const res = parseModule(moduleParsingConfig);
console.log(res);
//assert.ok(testobject(module1),"Failed object");


console.log('OK');
